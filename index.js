import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "mypass",
  port: 5432,
});

const app = express();
const port = 3000;

db.connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Error connecting to the database", err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs"); // Set view engine to ejs


// Function to update the database with the visited country
async function updateVisitedCountries(countryCode) {
  try {

const {rowCount} = await db.query(" SELECT * FROM visited_countries WHERE country_code = $1", [countryCode]);
if (rowCount > 0) {
  throw new Error("Country code already exists in visited countries");
}
    await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [
      countryCode,]);
    console.log("Visited country inserted successfully");
  } catch (err) {
    console.error("Error inserting visited country:", err.stack);
    throw err;
  }
}

app.post('/add',async (req,res)=>{
  const countryName = req.body.country
  try{
    const countryCode = await getCountryCodeFromName(countryName);
    // Update the database with the visited country
    await updateVisitedCountries(countryCode);
    // Redirect back to the homepage after adding the country
    res.redirect("/");
  } catch (err) {
    if(err.message ==="Country not found"){
      //res.status(404).send("Country name not found in the visited countries");
      res.render("index.ejs", { error: "Country name not found in the visited countries"});
    }

     else if(err.message==="Country code already exists in visited countries"){
      //res.status(400).send("Country name already exists in visited countries ");
      res.render("index.ejs", { error: "Country name already exists in the visited countries", total: 0 });
   } 
   
    else {
    console.error("Error processing request:", err);
    res.status(400).send("Country name already exists in the visited countries");
  }
  }
});


// Function to get the country code from the database based on the country name
async function getCountryCodeFromName(countryName) {
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%' ",
      [countryName.toLowerCase()]
    );
    if (result.rows.length > 0) {
      return result.rows[0].country_code;
    } else {
      throw new Error("Country not found");
    }
  } catch (err) {
    console.error("Error fetching country code:", err.stack);
    throw err;
  }
}

//this shows the country added on the map and the total number of the added countries
app.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT country_code FROM visited_countries");
    const visitedCountries = rows.map((row) => row.country_code);
    const total = visitedCountries.length;
    res.render("index.ejs", {
      countries:visitedCountries,
      total: total,
      error: false,
    });
  } catch (err) {
    console.error("Error fetching visited countries:", err.stack);
    res.render("index.ejs", {
      countries: [],
      //total: 0,
      error: "Error fetching visited countries",
    });
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
