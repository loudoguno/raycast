import { Form, ActionPanel, Action, showToast, Toast, popToRoot } from "@raycast/api";
import { useState } from "react";

interface FormValues {
  name: string;
  email: string;
  message: string;
  priority: string;
  subscribe: boolean;
}

export default function Command() {
  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();

  function dropNameErrorIfNeeded() {
    if (nameError && nameError.length > 0) {
      setNameError(undefined);
    }
  }

  function dropEmailErrorIfNeeded() {
    if (emailError && emailError.length > 0) {
      setEmailError(undefined);
    }
  }

  async function handleSubmit(values: FormValues) {
    // Validation
    if (values.name.length === 0) {
      setNameError("Name is required");
      return;
    }

    if (values.email.length === 0) {
      setEmailError("Email is required");
      return;
    }

    if (!values.email.includes("@")) {
      setEmailError("Invalid email format");
      return;
    }

    // Show success toast
    await showToast({
      style: Toast.Style.Success,
      title: "Form Submitted!",
      message: `Hello, ${values.name}!`,
    });

    // Log the values (in a real app, you'd send this to an API)
    console.log("Form values:", values);

    // Close the command
    await popToRoot();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Name"
        placeholder="Enter your name"
        error={nameError}
        onChange={dropNameErrorIfNeeded}
        onBlur={(event) => {
          if (event.target.value?.length === 0) {
            setNameError("Name is required");
          } else {
            dropNameErrorIfNeeded();
          }
        }}
      />

      <Form.TextField
        id="email"
        title="Email"
        placeholder="your@email.com"
        error={emailError}
        onChange={dropEmailErrorIfNeeded}
        onBlur={(event) => {
          const value = event.target.value;
          if (value?.length === 0) {
            setEmailError("Email is required");
          } else if (value && !value.includes("@")) {
            setEmailError("Invalid email format");
          } else {
            dropEmailErrorIfNeeded();
          }
        }}
      />

      <Form.TextArea
        id="message"
        title="Message"
        placeholder="Enter your message (optional)"
      />

      <Form.Dropdown id="priority" title="Priority" defaultValue="medium">
        <Form.Dropdown.Item value="low" title="Low" />
        <Form.Dropdown.Item value="medium" title="Medium" />
        <Form.Dropdown.Item value="high" title="High" />
      </Form.Dropdown>

      <Form.Checkbox
        id="subscribe"
        label="Subscribe to newsletter"
        defaultValue={false}
      />

      <Form.Description text="This is a simple form template demonstrating validation and submission." />
    </Form>
  );
}
