const standard_dashboard = (req, res) => {
    const user = req.session.user

    res.render('user_dashboard/dashboard', { title: "Standard User Dashboard", ...user })
}

export { standard_dashboard }