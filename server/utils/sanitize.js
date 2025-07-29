function sanitizeInput(input) {
    return input.replace(/[<>/&'"]/g, '');
}

module.exports = { sanitizeInput };
