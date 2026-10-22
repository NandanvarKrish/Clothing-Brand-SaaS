import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let todos: { id: string | number; name: string }[] | null = null;
  try {
    const { data } = await supabase.from("todos").select();
    todos = data;
  } catch {
    todos = null;
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Supabase Connection Test</h1>
      <ul className="list-disc pl-5 space-y-2">
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
      {(!todos || todos.length === 0) && (
        <p className="text-gray-500 text-sm mt-4">
          No todos found or table does not exist. Your clothing catalog is located in the &apos;products&apos; table.
        </p>
      )}
    </div>
  );
}
