const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

app.get("/movies/", async (request, response) => {
  const getMoviesList = `
  SELECT
   movie_name AS movieName
   FROM 
   movie;`;
  const movieList = await db.all(getMoviesList);
  response.send(movieList);
});

app.post("/movies/", async (request, response) => {
  const {
    directorId = 12,
    movieName = "sudheer",
    leadActor = "sunil",
  } = request.body;
  const getPostMovie = `
    INSERT INTO 
        movie(director_id,movie_name,lead_actor)
    VALUES (${directorId},
        '${movieName}',
        '${leadActor}');`;
  const movieAdd = await db.run(getPostMovie);
  const movie = movieAdd.lastID;
  response.send("Movie Successfully Added"); //
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT 
      *
    FROM 
      movie 
    WHERE 
      movie_id = ${movieId};`;
  const movie = await db.get(getMovieQuery);
  response.send(convertMovieDbObjectToResponseObject(movie));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId = 1, movieName, leadActor } = request.body;
  const getUpdateDetails = `
    Update
        movie
    SET 
       director_id = ${directorId},
       movie_name = '${movieName}',
       lead_actor = '${leadActor}'
    WHERE movie_id = ${movieId};`;
  const movie = await db.run(getUpdateDetails);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteList = `
    DELETE FROM 
    movie
    WHERE movie_id = ${movieId};`;
  await db.run(deleteList);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectors = `
    SELECT 
    director_id AS directorId,
    director_name AS directorName
    FROM 
    director;`;
  const directorsTable = await db.all(getDirectors);
  response.send(directorsTable);
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie
    WHERE
      director_id='${directorId}';`;
  const moviesArray = await db.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});
module.exports = app;
