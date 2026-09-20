/**
 * update_video_urls.js
 * Updates the `videoUrl` field for all problems in MongoDB based on `final_355_problems.json`.
 * 
 * Usage:
 *   cd backend
 *   node scripts/update_video_urls.js
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const problemModel = require("../src/models/problemModel.js");

const JSON_FILE_PATH = path.resolve(__dirname, "../../final_355_problems.json");
const BACKUP_FILE_PATH = path.resolve(__dirname, "backup_videoUrls.json");

async function updateVideoUrls() {
  try {
    // 1. Verify JSON file exists
    if (!fs.existsSync(JSON_FILE_PATH)) {
      throw new Error(`Could not find final_355_problems.json at: ${JSON_FILE_PATH}`);
    }

    const problemList = JSON.parse(fs.readFileSync(JSON_FILE_PATH, "utf8"));
    console.log(`Loaded ${problemList.length} problems from final_355_problems.json`);

    // 2. Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.DB_STRING);
    console.log("Connected to MongoDB successfully.");

    // 3. Create Backup of existing videoUrls
    console.log("Creating backup of existing videoUrl values...");
    const targetIds = problemList.map((p) => p.id);
    const existingDocs = await problemModel
      .find({ _id: { $in: targetIds } })
      .select("_id title videoUrl")
      .lean();

    const backupData = existingDocs.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      videoUrl: doc.videoUrl || null,
    }));

    fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(backupData, null, 2));
    console.log(`Backup saved to ${BACKUP_FILE_PATH} (${backupData.length} records)`);

    // 4. Build bulk operations (updating strictly ONLY videoUrl)
    const bulkOps = problemList
      .filter((item) => item.id && item.ytLink && item.ytLink.trim().length > 0)
      .map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: {
            $set: {
              videoUrl: item.ytLink.trim(),
            },
          },
        },
      }));

    console.log(`Prepared ${bulkOps.length} bulk update operations.`);

    // 5. Execute bulk write
    const bulkResult = await problemModel.bulkWrite(bulkOps, { ordered: false });

    console.log("\n================ Update Results ================");
    console.log(`Total Problems in File:   ${problemList.length}`);
    console.log(`Matched Documents in DB:  ${bulkResult.matchedCount}`);
    console.log(`Modified Documents in DB: ${bulkResult.modifiedCount}`);
    console.log("================================================\n");

    // 6. Verification check on sample documents
    console.log("--- Verifying Sample Updated Problems ---");
    const samples = await problemModel
      .find({ _id: { $in: targetIds.slice(0, 3) } })
      .select("title videoUrl")
      .lean();

    samples.forEach((sample, idx) => {
      console.log(`[${idx + 1}] Title:    "${sample.title}"`);
      console.log(`    videoUrl: ${sample.videoUrl}`);
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB. All updates completed successfully!");
  } catch (error) {
    console.error("Error updating video URLs:", error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

updateVideoUrls();
