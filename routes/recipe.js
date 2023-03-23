import express from "express";
import prisma from "../db/index.js";

export default function recipeRouter(passport) {

const router = express.Router();

router.get("/", async (request, response) => {
  const recipes = await prisma.recipe.findMany();

  if(recipes.length >= 1){
    response.status(200).json({
        success:true,
        recipes
    });
  } else {
    response.status(200).json({
        success: true,
        message: "No recipes were found"
    });
  }
});

router.post(
  "/",
  passport.authenticate("jwt", {session: false }),
 async (request, response) => {
  try {
    const newRecipe = await prisma.recipe.create({
        data:{
            name: request.body.name,
            description: request.body.description,
            userId: request.user.id
    }
  });

  if(newRecipe){
    response.status(201).json({
        success: true,
        message: "Created a new Recipe"
    });
  } else{
     response.status(500).json({
        success: false,
        message: "Failed to create a recipe"
     })
  }
  } catch(e){
    response.status(500).json({
        success: false,
        message: "Failed to create a recipe"
     })
  }
});

router.get("/:recipeId", async (request, response) => {
    const recipeId = request.params.recipeId;

    try {
        const foundRecipe = await prisma.recipe.findFirstOrThrow({
            where: {
                id: parseInt(recipeId)
            }
        });

        response.status(200).json({
            success: true,
            recipe: foundRecipe
        })
    } catch(e){
        response.status(404).json({
            success: false,
            message: "Could not find the recipe"
        });
    }
});

router.put(
  "/:recipeId",
   passport.authenticate("jwt", { session: false}),
async (request, response) => {
  const recipeId = request.params.recipeId;

  const updatedRecipes = await prisma.recipe.updateMany({
    where:{
      id: recipeId,
      userId: request.user.id
    },
    data:{
      name: request.body.name,
      description: request.body.description
    }
  });

  if(updatedRecipes.count == 1){
    response.status(200).json({
      success: true,
      message: "Updated the recipe"
    })
  }else {
    response.status(500).json({
      success: false,
      message: "No recipe is updated"
    })
  }
}
);


router.delete(
  "/:recipeId",
   passport.authenticate("jwt", { session: false}),
async (request, response) => {

const recipeId = parseInt(request.params.recipeId);

const deleteRecipe = await prisma.recipe.deleteMany({
  where:{
    id: recipeId,
    userId: request.user.id
  }
});
if(deleteRecipe.count == 1){
  response.status(200).json({
    success: true,
    message: "Recipe has been deleted"
  })
}else {
  response.status(500).json({
    success: false,
    message: "No recipe deleted"
  })
}
}
);


return router;   
}
 