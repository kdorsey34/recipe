 import express from "express";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import prisma from "../db/index.js";

const router = express.Router();

router.post("/signup", async (request, response) => {
  try {
    //Finds a user by their username, whatever the client sent 
    const user = await prisma.user.findFirst({
      where: {
        username: request.body.username,
      },
    });

    // if the user exists, send back a 401 because the user already exists
    if (user) {
      response.status(401).json({
        success: false,
        message: "User already exists",
      });
    } else {//if they dont exist then the will create a username and password
      try {
        //Hashes the password using argon2
        const hashedPassword = await argon2.hash(request.body.password);

        //Adds the user to our db using the new username and the hashed password. NEVER STORE A USER PASSWORD IN PLAIN TEXT
        const newUser = await prisma.user.create({
          data: {
            username: request.body.username,
            password: hashedPassword,
          },
        });

        //If the new user data is returned
        if (newUser) {
          //Send back a status of "Created"
          response.status(201).json({
            success: true,
            message: "Successfully created"
          });
        } else {
            console.log("errors here")
            //500 means internal server error
          response.status(500).json({
            success: false,
            message: "Something went wrong",
          });
        }
      } catch (error) {
        console.log(error)
        response.status(500).json({
          success: false,
          message: "Something went wrong",
        });
      }
    }
    //This is the outer catch block, don't provide too much info back to client(Generalize)
  } catch (e) {
    response.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

router.post("/login", async (request, response) => {
  try {//making sure we found the user
    const foundUser = await prisma.user.findFirstOrThrow({
      where: {
        username: request.body.username,
      },
    });

    try {
      const verifiedPassword = await argon2.verify(
        foundUser.password,
        request.body.password
      );//verifying if the password matches, jwt is created for the client
      //token will allow them to access any protected routes setup

      if (verifiedPassword) {
        const token = jwt.sign(//if the password matches then we 
          {
            user: {
              username: foundUser.username,
              id: foundUser.id,
            },
          },
          "thisIsASuperSecretKey"
        );
//once token is made then below would be the response to the client
        response.status(200).json({
          success: true,
          token//same as token: token
        });
      } else {//if the password is not verified-failed...then the client will recieve the below response
        response.status(401).json({
          success: false,
          message: "Wrong username or password",
        });
      }
    } catch (e) {
      response.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  } catch (e) {
    response.status(401).json({
      success: false,
      message: "Wrong username or password",
    });
  }
});

export default router;