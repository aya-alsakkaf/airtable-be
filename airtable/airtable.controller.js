const axios = require("axios");
require("dotenv").config();
const {
  AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID,
  AIRTABLE_TABLE_NAME,
  AIRTABLE_STUDENTS_TABLE_NAME,
} = process.env;

// Create Airtable API instance
const airtableApi = axios.create({
  baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`,
  headers: {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
});

async function fetchRecords(tableName) {
  try {
    const response = await airtableApi.get(`/${tableName}`);
    return response.data.records;
  } catch (error) {
    console.error(`Error fetching records from ${tableName}:`, error.message);
    throw error;
  }
}

async function createOrUpdateTaskRecord(
  studentId,
  grade,
  notes,
  repo,
  topic,
  studentGitHub
) {
  try {
    const existingTask = await checkStudentTask(repo);
    if (existingTask) {
      await updateTaskRecord(existingTask.id, grade, notes);
      console.log("Airtable Record Updated Successfully!");
    } else {
      await createTaskRecord(
        studentId,
        grade,
        notes,
        repo,
        topic,
        studentGitHub
      );
      console.log("Airtable Record Created Successfully!");
    }
  } catch (error) {
    console.error("Error updating Airtable:", error.message);
    throw error;
  }
}

async function createTaskRecord(
  studentId,
  grade,
  notes,
  repo,
  topic,
  studentGitHub
) {
  await airtableApi.post(`/${AIRTABLE_TABLE_NAME}`, {
    fields: {
      Students: [studentId],
      Grade: grade,
      Notes: notes,
      Repo: repo,
      Topic: topic,
      Github: studentGitHub,
    },
  });
}

async function updateTaskRecord(recordId, grade, notes) {
  await airtableApi.patch(`/${AIRTABLE_TABLE_NAME}/${recordId}`, {
    fields: { Grade: grade, Notes: notes },
  });
}

async function checkStudentTask(repo) {
  const tasks = await fetchRecords(AIRTABLE_TABLE_NAME);
  return tasks.find((task) => task.fields["Repo"].includes(repo));
}

const updateAirTable = async (req, res, next) => {
  try {
    const {
      passedTests,
      failedTests,
      studentGitHub,
      studentRepo,
      grade,
      topic,
    } = req.body;
    const students = await fetchRecords(AIRTABLE_STUDENTS_TABLE_NAME);
    const student = students.find(
      (s) => s.fields["GitHub Username"] === studentGitHub
    );

    if (!student) {
      throw new Error(
        `Student with GitHub username ${studentGitHub} not found`
      );
    }

    const notes = `Passed Tests ${passedTests}, Failed Tests ${failedTests}`;
    await createOrUpdateTaskRecord(
      student.id,
      grade / 100,
      notes,
      studentRepo,
      topic,
      studentGitHub
    );

    return res.status(200).json({ message: "Airtable updated successfully" });
  } catch (error) {
    console.error("Error Updating Airtable:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { updateAirTable };
