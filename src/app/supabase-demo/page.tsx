import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

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
