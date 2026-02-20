"""
Migration script to fix role fields in MongoDB for existing users.
This script will:
1. Find all users without a role field or with invalid roles
2. Set them to the default role ('user')
3. Special handling for the admin rollnumber
"""

from pymongo import MongoClient

# MongoDB connection
MONGO_URI = "mongodb+srv://nanduvinay719:76qqKRX4zC97yQun@travis.744fuyn.mongodb.net/travis_db?retryWrites=true&w=majority&appName=travis"
DEFAULT_ADMIN_ROLLNUMBER = "23BD1A056D"  # Update this to your admin roll number
ALLOWED_ROLES = {"admin", "user"}
DEFAULT_ROLE = "user"

def main():
    client = MongoClient(MONGO_URI)
    db = client.travis_db
    collection = db.data
    
    print("Starting role migration...")
    print("=" * 50)
    
    # Find all users
    all_users = list(collection.find({}))
    print(f"Found {len(all_users)} users in database")
    
    updated_count = 0
    
    for user in all_users:
        roll_number = user.get("RollNumber", "")
        current_role = user.get("role")
        
        # Check if role needs to be fixed
        needs_update = False
        new_role = None
        
        if current_role is None:
            print(f"\n❌ User {roll_number}: No role field found")
            needs_update = True
            new_role = "admin" if str(roll_number).upper() == DEFAULT_ADMIN_ROLLNUMBER else DEFAULT_ROLE
        elif isinstance(current_role, dict):
            print(f"\n❌ User {roll_number}: Role is a dict/object: {current_role}")
            needs_update = True
            new_role = "admin" if str(roll_number).upper() == DEFAULT_ADMIN_ROLLNUMBER else DEFAULT_ROLE
        elif not isinstance(current_role, str):
            print(f"\n❌ User {roll_number}: Role is not a string (type: {type(current_role)}): {current_role}")
            needs_update = True
            new_role = "admin" if str(roll_number).upper() == DEFAULT_ADMIN_ROLLNUMBER else DEFAULT_ROLE
        elif current_role.lower() not in ALLOWED_ROLES:
            print(f"\n⚠️  User {roll_number}: Invalid role '{current_role}'")
            needs_update = True
            new_role = "admin" if str(roll_number).upper() == DEFAULT_ADMIN_ROLLNUMBER else DEFAULT_ROLE
        else:
            # Role is valid
            print(f"✅ User {roll_number}: Role '{current_role}' is valid")
        
        if needs_update:
            print(f"   → Updating to: {new_role}")
            result = collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"role": new_role}}
            )
            if result.modified_count > 0:
                print(f"   ✅ Updated successfully")
                updated_count += 1
            else:
                print(f"   ❌ Failed to update")
    
    print("\n" + "=" * 50)
    print(f"Migration complete!")
    print(f"Total users: {len(all_users)}")
    print(f"Updated: {updated_count}")
    print(f"Already valid: {len(all_users) - updated_count}")
    
    client.close()

if __name__ == "__main__":
    main()
