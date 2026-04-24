import { getCities } from "../../server/shopStore.js";

export default function handler(_req, res) {
  res.status(200).json({
    cities: getCities(),
  });
}
