import path from "path";
import reader from "xlsx";

async function sal () {
  try {
    const filePath = path.join(__dirname, '../merit.xlsx')
    const workBook =  await reader.readFile(filePath);
//convert xlsx to JSON
    const sheets = workBook.SheetNames;
    //console.log(sheets.length)
    for (let i = 0; i < sheets.length; i++) {
      const temp = reader.utils.sheet_to_json(
        workBook.Sheets[workBook.SheetNames[i]])
      for (const res1 of temp) {
        console.log(res1)

      }

    }

  } catch (e) {
    console.log(e.message)
    //node -e 'require("./routes/leaveApplication.js").salary()'

  }
}

sal();
