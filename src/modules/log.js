module.exports = (args) => {
    return process.stdout.write(` [${+ new Date()}] - ${args}\n`)
}