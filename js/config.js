exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                       (process.env.NODE_ENV === 'production' ?
                            'mongodb://127.0.0.1/side_effects' :
                            'mongodb://127.0.0.1/side_effects-dev');
exports.PORT = process.env.PORT || 8080;