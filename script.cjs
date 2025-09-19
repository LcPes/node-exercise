const argv = require("node:process").argv
const fs = require("node:fs")
const path = require("node:path")

const getFilePath = () => {
  if (argv.length <= 2) {
    throw new Error("CSV file not provided")
  } else if (argv.length > 3) {
    throw new Error("Too many arguments")
  }

  const providedFilePath = argv[2]
  const filePath = path.isAbsolute(providedFilePath) ? providedFilePath : path.join(__dirname, providedFilePath)

  if (!fs.existsSync(filePath)) {
    throw new Error("The provided file does not exists, check the inserted path")
  }

  return filePath
}

const processFile = async (filePath) => {

}

const main = async () => {
  try {
    const filePath = getFilePath()
    console.log(filePath)
    await processFile(filePath)
  } catch (err) {
    console.error(err.message)
  }
}

main()
