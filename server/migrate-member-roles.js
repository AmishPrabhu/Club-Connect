import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './models/User.js';
import ClubMember from './models/ClubMember.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function migrateExistingMembers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/club-connect');
        console.log('✅ Connected to MongoDB');

        // Find all club members
        const allClubMembers = await ClubMember.find({});
        console.log(`📊 Found ${allClubMembers.length} club memberships`);

        // Get unique emails
        const uniqueEmails = [...new Set(allClubMembers.map(m => m.email))];
        console.log(`👥 Found ${uniqueEmails.length} unique members`);

        let updatedCount = 0;
        let skippedCount = 0;
        let notFoundCount = 0;

        // Update each user
        for (const email of uniqueEmails) {
            const user = await User.findOne({ email });

            if (!user) {
                console.log(`⚠️  User not found: ${email}`);
                notFoundCount++;
                continue;
            }

            if (user.role === 'user') {
                user.role = 'club-member';
                await user.save();
                console.log(`✅ Updated ${email}: user → club-member`);
                updatedCount++;
            } else {
                console.log(`⏭️  Skipped ${email}: already has role '${user.role}'`);
                skippedCount++;
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`   ✅ Updated: ${updatedCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        console.log(`   ⚠️  Not Found: ${notFoundCount}`);
        console.log(`   📊 Total: ${uniqueEmails.length}`);

        await mongoose.connection.close();
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateExistingMembers();
