import { config } from 'dotenv';

const envFiles = ['.venv.local', '.env.local', '.env'];

for (const path of envFiles) {
  config({ path, override: false, quiet: true });
}
