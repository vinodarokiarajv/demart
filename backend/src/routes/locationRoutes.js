const express = require("express");
const locationController = require("../controllers/locationController");

const router = express.Router();

router.get("/countries", locationController.getCountries);

router.get("/regions", locationController.getRegions);

router.get("/cities", locationController.getCities);

module.exports = router;