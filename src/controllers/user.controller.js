import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const registerUser = asyncHandler( async (req, res) => {

    const {fullName, email, username, password } = req.body
    

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is also required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const generateAccessAndRefreshToken = async(userID) => {
    try {
        const user = await User.findById(userID)
        const accesToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken ()

        user.refreshToken = refreshToken
        user.save({validateBeforeSave: false})
        return {accesToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "something went wrong whire generating acces & refresh token")
        
    }
}

const loginUser = asyncHandler(async (req, res)=> {
    //req.body bring the data from the database
    //username and email
    //if user not found return error
    // found check password with username 
    //acces and refresh token
    //send tokens by cookies

    const { email, username, password} = req.body
    
    if(!username || email){
        throw new ApiError(400, "username or email is required")

    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(400, "user is not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(isPasswordValid){
        throw new ApiError(400, "password is incorrect")
    }

    const {accesToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accesToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accesToken, refreshToken
            },
            "user logged in successfully"
        )
    )


})

const logoutUser = asyncHandler(async(req,res) => {
    
})
export { registerUser, loginUser}