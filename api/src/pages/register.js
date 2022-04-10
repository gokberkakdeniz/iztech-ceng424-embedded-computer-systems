//import Link from "next/link";
function RegisterForm() {
  return (
    <div className="container">
      <h1>Register</h1>
      <p>Please fill in this form to create an account.</p>
      <br />
      <label htmlFor="email">
        <b>Email</b>
        <br />
      </label>

      <input
        type="text"
        placeholder="Enter Email"
        name="email"
        id="email"
        required
      />

      <label htmlFor="psw">
        <br />
        <b>Password</b>
      </label>
      <br />
      <input
        type="password"
        placeholder="Enter Password"
        name="psw"
        id="psw"
        required
      />
      <br />

      <label htmlFor="psw-repeat">
        <b>Repeat Password</b>
        <br />
      </label>
      <input
        type="password"
        placeholder="Repeat Password"
        name="psw-repeat"
        id="psw-repeat"
        required
      />

      <button type="submit" className="registerbtn">
        Register
      </button>
    </div>
  );
}

export default RegisterForm;
