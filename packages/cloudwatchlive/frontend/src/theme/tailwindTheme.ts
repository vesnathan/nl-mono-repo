
import tailwindConfig from "../../tailwind.config";
import resolveConfig from "tailwindcss/resolveConfig";


console.log("tailwindConfig", tailwindConfig)
const fullConfig = resolveConfig(tailwindConfig);
console.log(fullConfig.theme)
export default fullConfig.theme;
