import passport from 'passport';
import { localStrategy } from '../strategies/local';
import { customerLocalStrategy } from '../strategies/customer-local';
import { jwtStrategy } from '../strategies/jwt';

passport.use(localStrategy);
passport.use('customer-local', customerLocalStrategy);
passport.use(jwtStrategy);

export default passport;
