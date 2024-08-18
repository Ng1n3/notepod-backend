import merge from 'lodash.merge'
import { Config } from '../interfaces';
import localConfig from './local';
import prodConfig from './prod';
import testingConfig from './testing';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const stage = process.env.STAGE || 'local';

let envConfig: Partial<Config>;

if (stage === 'production') {
  envConfig = prodConfig;
} else if (stage === 'testing') {
  envConfig = testingConfig;
} else {
  envConfig = localConfig;
}

const baseConfig: Config = {
  stage,
  env: process.env.NODE_ENV,
  port: process.env.PORT || '4000',
};

export default merge(baseConfig, envConfig);
