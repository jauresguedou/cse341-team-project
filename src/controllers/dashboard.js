import Confirmation from "../models/schemas/confirmation.js"

const standard_dashboard = (req, res) => {
    const user = req.session.user
    res.render('dashboard/dashboard', { title: "Standard User Dashboard", ...user })
}

const dashboard_bookings = async (req, res) => {
    try {
        const email = req.session.user.email;
        const bookings = await Confirmation.find({ "passengers.email": email })
        return res.status(200).json(bookings)
    } catch (err) {
        console.error(err)
        return res.status(404).json([])
    }
}

export { standard_dashboard, dashboard_bookings }