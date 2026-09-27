function formatProject(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    owner: row.owner,
    memberCount: row.member_count,
    myRole: row.my_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  formatProject,
};
