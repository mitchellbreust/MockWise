// middleware/validateRequestBody.js
export const validateRequestBody = (req, res, next) => {
    if (!req.body) {
        return res.status(400).json({ error: 'Missing request body' });
    }
    next();
};
