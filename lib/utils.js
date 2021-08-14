const clamp = (n, from, to) => Math.min(Math.max(n, from), to);

const chunk = (arr, len) => {
    if (!arr.length) {
        return [arr]
    }

    const chunks = []

    while (arr.length > 0) {
        chunks.push(arr.splice(0, len))
    }

    return chunks
}

module.exports = { chunk }