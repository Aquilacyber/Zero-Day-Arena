/**
 * Shared authentication middleware.
 * Redirects unauthenticated users to the login page.
 */
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    next();
};

module.exports = { requireAuth };
