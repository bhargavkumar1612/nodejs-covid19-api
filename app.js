const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

//  serve and database initialization
const initializeDBAndStartServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log("DB error.", e);
    process.exit(0);
  }
};
initializeDBAndStartServer();

// get all movies api
app.get("/movies/", async (request, response) => {
  const allMoviesQuery = `
    select
    movie_name
    from
    movie;
    `;
  const allMovies = await db.all(allMoviesQuery);
  const allMoviesResponse = allMovies.map((item) => {
    return { movieName: item.movie_name };
  });
  response.send(allMoviesResponse);
});

//post a new movie to the table api
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { movieName, directorId, leadActor } = movieDetails;
  const insertMovieQuery = `
    insert
    into 
    movie (movie_name, director_id, lead_actor)
    values ('${movieName}','${directorId}','${leadActor}');
    `;
  await db.run(insertMovieQuery);
  //   const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

//update the movie details at the given movie id api
app.put("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { movieName, directorId, leadActor } = movieDetails;
  const updateMovieQuery = `
    update movie 
    set 
    movie_name = '${movieName}',
    director_id= ${directorId},
    lead_actor="${leadActor}" 
    where movie_id = ${movieId};
    `;
  await db.run(updateMovieQuery);
  response.send(`Movie Details Updated`);
});
