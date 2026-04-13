export function requireTeacherAuth(request) {
  const secret = request.headers.get('x-teacher-secret');
  if (!secret || secret !== process.env.TEACHER_API_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
