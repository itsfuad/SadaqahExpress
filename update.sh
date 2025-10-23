#!/bin/bash

OLD_EMAIL="46718479-fuadcs22@users.noreply.replit.com"
CORRECT_NAME="Fuad Hasan"
CORRECT_EMAIL="fuad.cs22@gmail.com"

git filter-branch --env-filter "
# Fix author and committer info
if [ \"\$GIT_COMMITTER_EMAIL\" = \"$OLD_EMAIL\" ]
then
    export GIT_COMMITTER_NAME=\"$CORRECT_NAME\"
    export GIT_COMMITTER_EMAIL=\"$CORRECT_EMAIL\"
fi
if [ \"\$GIT_AUTHOR_EMAIL\" = \"$OLD_EMAIL\" ]
then
    export GIT_AUTHOR_NAME=\"$CORRECT_NAME\"
    export GIT_AUTHOR_EMAIL=\"$CORRECT_EMAIL\"
fi
" --msg-filter '
# Remove Replit metadata from commit messages
sed "/^Replit-Commit-Author:/,/^$/d"
' --tag-name-filter cat -- --branches --tags
