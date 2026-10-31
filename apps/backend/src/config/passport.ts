import passport from 'passport';
import { customerLocalStrategy } from '../strategies/customer-local';
import { jwtStrategy } from '../strategies/jwt';

passport.use('customer-local', customerLocalStrategy);
passport.use(jwtStrategy);

export default passport;
