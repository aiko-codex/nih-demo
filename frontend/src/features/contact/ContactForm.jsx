import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.email("Enter a valid email address."),
  message: z.string().trim().min(10, "Please write at least 10 characters."),
});

const fieldClass =
  "w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-[15px] text-white outline-none " +
  "transition-colors placeholder:text-white/30 focus:border-primary";

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-red-400">{error.message}</span>}
    </label>
  );
}

export default function ContactForm() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contactSchema),
  });

  function submitMessage() {
    toast.success("Thanks, we will reply soon.");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submitMessage)} className="space-y-8" noValidate>
      <div className="grid gap-8 sm:grid-cols-2">
        <Field label="Name" error={errors.name}>
          <input className={fieldClass} autoComplete="name" placeholder="Your full name" {...register("name")} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            className={fieldClass}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </Field>
      </div>
      <Field label="Message" error={errors.message}>
        <textarea
          className={`${fieldClass} resize-none`}
          rows={5}
          placeholder="How can we help?"
          {...register("message")}
        />
      </Field>
      <button
        type="submit"
        disabled={isSubmitting}
        className="h-12 rounded-full bg-white px-8 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-60"
      >
        Send message
      </button>
    </form>
  );
}
