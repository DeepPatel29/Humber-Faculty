UPDATE "User" SET role = 'STAFF'::"AppRole" WHERE role::text = 'FACULTY';
