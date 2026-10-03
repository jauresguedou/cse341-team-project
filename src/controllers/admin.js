import User from '../models/user.js'
import Role from '../models/role.js'
const adminDashboardPage = (req, res) => {
    res.render('admin/dashboard', { title: 'Admin Dashboard' });
};

const adminUsers = async (req, res) => {
    try {
        const users = await User.find({}).populate("role");
        return res.status(200).json(users)
    } catch (err) {
        return res.status(500).json({ error: err })
    }
}

const adminDeleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete({ _id: userId });
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

const adminUpdateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const adminRoleId = await Role.findOne({ name: 'admin' });
        const updateUser = await User.findByIdAndUpdate(userId, { role: adminRoleId._id }, { new: true });
        if (!updateUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(updateUser);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        return res.status(500).json({ error: err.message });
    }
};

export { adminDashboardPage, adminUsers, adminDeleteUser, adminUpdateUser };