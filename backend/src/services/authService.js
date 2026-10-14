const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { AppError } = require('../utils/apiResponse');
const { logAction } = require('./auditService');

class AuthService {
  async login(email, password, req) {
    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user document
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    await logAction({
      user: user._id,
      userName: user.name,
      role: user.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id.toString(),
      details: { email: user.email },
      req
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone
      },
      accessToken,
      refreshToken
    };
  }

  async refreshToken(refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await User.findOne({
      _id: decoded.id,
      isActive: true,
      'refreshTokens.token': refreshToken
    });

    if (!user) {
      throw new AppError('Refresh token revoked or invalid', 401);
    }

    // Token rotation: remove used refresh token and issue a new pair
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(refreshToken, userId, req) {
    if (refreshToken && userId) {
      await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: { token: refreshToken } }
      });
    }

    await logAction({
      user: userId,
      userName: req.user?.name || 'User',
      role: req.user?.role || 'UNKNOWN',
      action: 'LOGOUT',
      entity: 'User',
      entityId: userId?.toString(),
      req
    });

    return true;
  }
}

module.exports = new AuthService();
