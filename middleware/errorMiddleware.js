const {validationResult} = require("express-validator");

module.exports.basicErrorMiddleware = (view, auth=false) => { 
    const errorMiddleware = (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const options = {
                errors: errors.array(),
            }
            if (auth) {
                options.user = req.user;
            }
            return res.status(400).render(view, options);
        };
        next();
    }

    return errorMiddleware;
}