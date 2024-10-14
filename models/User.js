const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const rolesEnum = [
  'list_all_orders', 'select_user', 'promote_admin', 'add_roles'
];

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  roles: { type: [String], enum: rolesEnum, default: [] },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.updateLastLogin = function() {
  this.lastLogin = Date.now();
  return this.save();
};

const User = mongoose.model('User', UserSchema);

module.exports = {
  rolesEnum,
  User
};