import User from '../models/user.js'
import Role from '../models/role.js'
const adminDashboardPage = (req, res) => {
    res.render('admin/dashboard', { title: 'Admin Dashboard' });
};


const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const adminUsers = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 3, 1), 100);
        const skip = (page - 1) * limit;
        const q = String(req.query.q || '').trim();

        const filter = {};
        if (q) {
            const regex = new RegExp(escapeRegex(q), 'i');
            filter.$or = [
                { displayName: regex },
                { email: regex },
                { username: regex },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password -__v')
                .populate('role', 'name')
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            users,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error('adminUsers error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

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