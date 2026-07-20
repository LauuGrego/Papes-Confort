import passport from 'passport';
import { localStrategy } from '../strategies/local';
import { jwtStrategy } from '../strategies/jwt';

passport.use(localStrategy);
passport.use(jwtStrategy);

export default passport;
