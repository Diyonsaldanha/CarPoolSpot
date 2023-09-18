import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { FiUser, FiMail, FiLock, FiPhone } from "react-icons/fi"; // Import icons
import './SignUp.css';
import { Link } from "react-router-dom";

export default function SignUp({ setToken }) {
    const [name, setName] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmpassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");

    function signupUser(userDetails) {
        return fetch(process.env.REACT_APP_END_POINT + '/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userDetails)
        })
        .then((response) => {
            console.log(response);
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText);
        })
        .then((responseJson) => {
            return responseJson;
        })
        .catch((error) => {
            alert(error);
        });
    }

    const handleSubmit = async e => {
        e.preventDefault();
        const data = {
            name,
            lastname,
            email,
            password,
            confirmpassword,
            phone_number: phone,
        }
        const sessionUserDetails = await signupUser(data);
        if (sessionUserDetails && sessionUserDetails.token) {
            setToken({ token: sessionUserDetails.token, name: sessionUserDetails.user.name });
            window.location.reload();
        }
    }

    function validateForm() {
        return (
            email.length > 0 &&
            password.length > 0 &&
            name.length > 0 &&
            lastname.length > 0 &&
            password === confirmpassword
        );
    }

   return (
        <div className="signup-container">
            <div className="signup-content">
                <Form onSubmit={handleSubmit}>
                    <h3 className="heading-text">Sign Up</h3>

                    <Form.Group size="lg" controlId="name">
                        <div className="input-icon">
                            <FiUser className="icon" />
                            <Form.Control
                                autoFocus
                                data-test="first-name-form-control"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="First Name"
                            />
                        </div>
                    </Form.Group>

                    {/* Add gap */}
                    <div className="field-gap" />

                    <Form.Group size="lg" controlId="lastname">
                        <div className="input-icon">
                            <FiUser className="icon" />
                            <Form.Control
                                data-test="last-name-form-control"
                                type="text"
                                value={lastname}
                                onChange={(e) => setLastname(e.target.value)}
                                placeholder="Last Name"
                            />
                        </div>
                    </Form.Group>

                    {/* Add gap */}
                    <div className="field-gap" />

                    <Form.Group size="lg" controlId="email">
                        <div className="input-icon">
                            <FiMail className="icon" />
                            <Form.Control
                                data-test="email-form-control"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                            />
                        </div>
                    </Form.Group>

                    {/* Add gap */}
                    <div className="field-gap" />

                    <Form.Group size="lg" controlId="phone">
                        <div className="input-icon">
                            <FiPhone className="icon" />
                            <Form.Control
                                data-test="phone-form-control"
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Mobile Number"
                            />
                        </div>
                    </Form.Group>

                    {/* Add gap */}
                    <div className="field-gap" />

                    <Form.Group size="lg" controlId="password">
                        <div className="input-icon">
                            <FiLock className="icon" />
                            <Form.Control
                                data-test="password-form-control"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                            />
                        </div>
                    </Form.Group>

                    {/* Add gap */}
                    <div className="field-gap" />

                    <Form.Group size="lg" controlId="confirmpassword">
                        <div className="input-icon">
                            <FiLock className="icon" />
                            <Form.Control
                                data-test="conf-password-form-control"
                                type="password"
                                value={confirmpassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Password"
                            />
                        </div>
                    </Form.Group>

                    {/* Add gap */}
                    <div className="field-gap" />

                    <Button
                        size="lg"
                        type="submit"
                        disabled={!validateForm()}
                        className="signup-button"
                        data-test="signup-button"
                        style={{ backgroundColor: 'yellow', borderColor: 'yellow', color: 'black' }}
                    >
                        Sign Up
                    </Button>
                </Form>
                <Link to="/login" className="login-link">
                    Login
                </Link>
            </div>
        </div>
    );
}