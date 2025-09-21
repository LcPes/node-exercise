"use strict"

const argv = require("node:process").argv
const fs = require("node:fs")
const path = require("node:path")
const readline = require("node:readline")

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

const createTrackers = () => ({
  maxAmountWithDiscount: {
    value: -Infinity,
    record: null,
    process: function(row) {
      const totalAmount = row["unit price"] * row["quantity"] * (1 - row["percentage discount"] / 100)
      if (totalAmount < this.value) return
      this.value = totalAmount
      this.record = row

    },
    get message() {
      return `Max amount with discount: ${this.value}\nRecord: ${JSON.stringify(this.record)}`
    }
  },
  maxQuantity: {
    value: -Infinity,
    record: null,
    process: function(row) {
      const quantity = row["quantity"]
      if (quantity < this.value) return
      this.value = quantity
      this.record = row
    },
    get message() {
      return `Max quantity between all the items: ${this.value}\nRecord: ${JSON.stringify(this.record)}`
    }
  },
  MaxDiffWithAndWithoutDiscont: {
    value: -Infinity,
    record: null,
    process: function(row) {
      const diff = row["quantity"] * row["unit price"] * row["percentage discount"] / 100
      if (diff < this.value) return
      this.value = diff
      this.record = row
    },
    get message() {
      return `Max difference between total amount with and without discount: ${this.value}\nRecord: ${JSON.stringify(this.record)}`
    }
  }
})

const processFile = async (inputFilePath) => {
  const rl = readline.createInterface({ input: fs.createReadStream(inputFilePath, { encoding: "utf-8" }) })

  let headers = []
  let isFirstLine = true


  const trackers = createTrackers()

  for await (const line of rl) {
    const values = line.trim().split(",")

    if (isFirstLine) {
      headers = values.map(v => v.toLowerCase())
      isFirstLine = false
      continue
    }

    const row = Object.fromEntries(headers.map((h, i) => {
      const raw = values[i]
      const number = Number(raw)
      return [h, isNaN(number) ? raw : number]
    }))

    Object.values(trackers).forEach(tracker => tracker.process(row))
  }

  Object.values(trackers).forEach(tracker => console.log(tracker.message + "\n"))
}

const main = async () => {
  try {
    const filePath = getFilePath()
    await processFile(filePath)
  } catch (err) {
    console.error(err.message)
  }
}

main()
