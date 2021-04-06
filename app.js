const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

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

// get all states api
app.get("/states/", async (request, response) => {
  const allStatesQuery = `
    select
    *
    from
    state
    order by
    state_id;
    `;
  const allStates = await db.all(allStatesQuery);
  const allStatesResponse = allStates.map((item) => {
    return {
      stateId: item.state_id,
      stateName: item.state_name,
      population: item.population,
    };
  });
  response.send(allStatesResponse);
});

// get a state with state id api
app.get("/states/:stateId", async (request, response) => {
  stateId = request.params.stateId;
  const getStateQuery = `
    select
    *
    from
    state
    where state_id=${stateId};
    `;
  try {
    const stateDetails = await db.get(getStateQuery);
    const getStateResponse = {
      stateId: stateDetails.state_id,
      stateName: stateDetails.state_name,
      population: stateDetails.population,
    };
    response.send(getStateResponse);
  } catch (TypeError) {
    console.log("state_id out of range");
  }
});

//post a new district to the district table api
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const insertDistrictQuery = `
    INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(insertDistrictQuery);
  response.send("District Successfully Added");
});

// get a district with district id api
app.get("/districts/:districtId", async (request, response) => {
  districtId = request.params.districtId;
  const getDistrictQuery = `
    select
    *
    from
    district
    where district_id=${districtId};
    `;
  try {
    const districtDetails = await db.get(getDistrictQuery);
    const getDistrictResponse = {
      districtId: districtDetails.district_id,
      districtName: districtDetails.district_name,
      stateId: districtDetails.state_id,
      cases: districtDetails.cases,
      cured: districtDetails.cured,
      active: districtDetails.active,
      deaths: districtDetails.deaths,
    };
    response.send(getDistrictResponse);
  } catch (TypeError) {
    console.log("id out of range");
  }
});

// delete a district with given district Id

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
         DELETE FROM district
         WHERE
            district_id = ${districtId};
        `;
  await db.run(deleteQuery);
  response.send(`District Removed`);
});

//update the district details at the given district id api
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    deaths,
    active,
  } = districtDetails;
  const updateDistrictQuery = `
    update district 
    set 
    district_name="${districtName}",
    state_id = ${stateId},
    cases= ${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    where district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// get a the stats of a state with state id api
app.get("/states/:stateId/stats/", async (request, response) => {
  var stateId = request.params.stateId;
  const getStateStatsQuery = `
    select
    sum(cases) as total_cases,
    sum(cured) as cured_cases,
    sum(active) as active_cases,
    sum(deaths) as total_deaths
    from
    state left join district on district.state_id = state.state_id
    where state.state_id=${stateId};
    `;
  try {
    const stateStats = await db.get(getStateStatsQuery);
    const getStateStatsResponse = {
      totalCases: stateStats.total_cases,
      totalCured: stateStats.cured_cases,
      totalActive: stateStats.active_cases,
      totalDeaths: stateStats.total_deaths,
    };
    response.send(getStateStatsResponse);
  } catch (TypeError) {
    console.log("id out of range");
  }
});

// get the state with district id api
app.get("/districts/:districtId/details/", async (request, response) => {
  const districtId = request.params.districtId;
  const districtStateQuery = `
    select
    state_name
    from
    state left join district on state.state_id = district.state_id
    where district_id = ${districtId};
    `;
  const districtState = await db.get(districtStateQuery);
  const districtStateResponse = {
    stateName: districtState.state_name,
  };
  response.send(districtStateResponse);
});

module.exports = app;
