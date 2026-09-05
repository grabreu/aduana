export { Aduana, create } from "./aduana";
export * from "./errors";
export * from "./types";

import { Aduana, create } from "./aduana";
import {
  HttpError,
  isHttpError,
  isProblemDetails,
  isTransientError,
  isValidationProblemDetails,
} from "./errors";

const aduana = Object.assign(new Aduana(), {
  create,
  Aduana,
  HttpError,
  isHttpError,
  isProblemDetails,
  isValidationProblemDetails,
  isTransientError,
});

export default aduana;
