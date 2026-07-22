const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");
const Station = require("./models/Station");
const Hotspot = require("./models/Hotspot");

const mongoUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/city_aqi";

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUrl);
        console.log("Connected successfully.");

        // 1. Clear existing database collections (only users, stations, hotspots)
        console.log("Cleaning collections...");
        await User.deleteMany({});
        await Station.deleteMany({});
        await Hotspot.deleteMany({});
        console.log("Database cleared.");

        // 2. Seed Default Super Admin User
        console.log("Seeding super admin...");
        const adminPasswordHash = await bcrypt.hash("adminpassword", 8);
        const superAdmin = await User.create({
            name: "Super Admin",
            email: "admin@cityaqi.com",
            password: adminPasswordHash,
            role: "SUPER_ADMIN",
            city: "Delhi",
            phone: "9999999999",
        });
        console.log("Seeded Super Admin successfully.");

        // Seed City Admin
        console.log("Seeding city admin...");
        const cityAdminPasswordHash = await bcrypt.hash("citypassword", 8);
        await User.create({
            name: "Delhi City Admin",
            email: "cityadmin@cityaqi.com",
            password: cityAdminPasswordHash,
            role: "CITY_ADMIN",
            city: "Delhi",
            phone: "8888888888",
        });

        // Seed Officer
        console.log("Seeding officer...");
        const officerPasswordHash = await bcrypt.hash("delhiofficer", 8);
        await User.create({
            name: "Delhi Officer",
            email: "delhiofficer@cityaqi.com",
            password: officerPasswordHash,
            role: "OFFICER",
            city: "Delhi",
            phone: "7777777777",
        });
        console.log("Seeded City Admin and Officer successfully.");

        // 3. Seed Monitoring Stations
        console.log("Seeding stations...");
        const stations = [
            // Delhi Stations
            {
                stationName: "Anand Vihar, Delhi - DPCC",
                city: "Delhi",
                location: "Anand Vihar",
                AQI: 310,
                PM25: 310,
                PM10: 590,
                NO2: 120,
                SO2: 24,
                CO: 3.5,
                O3: 45,
                status: "ACTIVE",
            },
            {
                stationName: "Wazirpur, Delhi - DPCC",
                city: "Delhi",
                location: "Wazirpur",
                AQI: 324,
                PM25: 324,
                PM10: 633,
                NO2: 206,
                SO2: 20,
                CO: 4.5,
                O3: 40,
                status: "ACTIVE",
            },
            {
                stationName: "Mundka, Delhi - DPCC",
                city: "Delhi",
                location: "Mundka",
                AQI: 296,
                PM25: 296,
                PM10: 631,
                NO2: 137,
                SO2: 15,
                CO: 3.8,
                O3: 35,
                status: "ACTIVE",
            },
            // Mumbai Stations
            {
                stationName: "Bandra, Mumbai - MPCB",
                city: "Mumbai",
                location: "Bandra West",
                AQI: 120,
                PM25: 60,
                PM10: 120,
                NO2: 35,
                SO2: 12,
                CO: 1.2,
                O3: 28,
                status: "ACTIVE",
            },
            {
                stationName: "Colaba, Mumbai - MPCB",
                city: "Mumbai",
                location: "Colaba",
                AQI: 85,
                PM25: 42,
                PM10: 85,
                NO2: 25,
                SO2: 8,
                CO: 0.8,
                O3: 22,
                status: "ACTIVE",
            },
            {
                stationName: "Kopripada-Vashi, Navi Mumbai - MPCB",
                city: "Mumbai",
                location: "Vashi",
                AQI: 224,
                PM25: 224,
                PM10: 499,
                NO2: 219,
                SO2: 22,
                CO: 2.1,
                O3: 55,
                status: "ACTIVE",
            },
            // Bengaluru Stations
            {
                stationName: "BTM Layout, Bengaluru - CPCB",
                city: "Bengaluru",
                location: "BTM Layout",
                AQI: 95,
                PM25: 24,
                PM10: 95,
                NO2: 28,
                SO2: 9,
                CO: 0.6,
                O3: 24,
                status: "ACTIVE",
            },
            {
                stationName: "Kasturi Nagar, Bengaluru - KSPCB",
                city: "Bengaluru",
                location: "Kasturi Nagar",
                AQI: 873,
                PM25: 873,
                PM10: 890,
                NO2: 28,
                SO2: 10,
                CO: 1.5,
                O3: 32,
                status: "ACTIVE",
            },
            // Kolkata Stations
            {
                stationName: "Jadavpur, Kolkata - WBPCB",
                city: "Kolkata",
                location: "Jadavpur",
                AQI: 110,
                PM25: 70,
                PM10: 110,
                NO2: 30,
                SO2: 10,
                CO: 1.0,
                O3: 25,
                status: "ACTIVE",
            },
            {
                stationName: "Victoria Memorial, Kolkata - WBPCB",
                city: "Kolkata",
                location: "Victoria Memorial",
                AQI: 65,
                PM25: 38,
                PM10: 65,
                NO2: 18,
                SO2: 6,
                CO: 0.5,
                O3: 18,
                status: "ACTIVE",
            }
        ];
        await Station.create(stations);
        console.log("Seeded stations successfully.");

        // 4. Seed Hotspots/Anomalies detected from ML
        console.log("Seeding hotspots...");
        const hotspots = [
            {
                name: "Delhi Wazirpur Hotspot",
                location: "Wazirpur, Delhi - DPCC",
                latitude: 28.699,
                longitude: 77.168,
                aqi: 324,
                severity: "SEVERE",
                source: "WASTE_BURNING",
                recommendation: "Deploy patrol teams to identify and prevent open waste burning. Fine violators.",
                status: "ACTIVE",
            },
            {
                name: "Bengaluru Industrial Construction Hotspot",
                location: "Kasturi Nagar, Bengaluru - KSPCB",
                latitude: 13.018,
                longitude: 77.648,
                aqi: 873,
                severity: "SEVERE",
                source: "CONSTRUCTION",
                recommendation: "Inspect construction sites for dust suppression compliance. Issue water sprinkler mandates.",
                status: "ACTIVE",
            },
            {
                name: "Navi Mumbai Industrial Cluster Hotspot",
                location: "Kopripada-Vashi, Navi Mumbai - MPCB",
                latitude: 19.083,
                longitude: 73.008,
                aqi: 224,
                severity: "VERY_HIGH",
                source: "INDUSTRY",
                recommendation: "Conduct emission audit on nearby industrial units. Check stack emission compliance.",
                status: "ACTIVE",
            }
        ];
        await Hotspot.create(hotspots);
        console.log("Seeded hotspots successfully.");

        console.log("Database Seeding Finished Successfully!");
    } catch (err) {
        console.error("Seeding Error:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

seed();
