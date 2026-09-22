import mongoose from 'mongoose';
import roleSchema from './schemas/role.js';

const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);

export default Role;
