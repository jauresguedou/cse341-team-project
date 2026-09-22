const homePage = (req, res) => {
    res.render('home', { title: 'Kizuna Rail' });
};

const aboutPage = (req, res) => {
    res.render('about', { title: 'About' });
};

const testErrorPage = (req, res, next) => {
    const err = new Error('Internal server error. Please try again later.');
    err.status = 500;
    next(err);
};

export { homePage, aboutPage, testErrorPage };