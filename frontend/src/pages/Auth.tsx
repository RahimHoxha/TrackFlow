import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { api, ApiRequestError } from '../api';
import { colors } from '../theme';

const { Title, Text, Paragraph } = Typography;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values: {
    email: string;
    password: string;
    name?: string;
  }) => {
    setError('');
    setLoading(true);

    try {
      const res = isLogin
        ? await api.login({ email: values.email, password: values.password })
        : await api.register({
            email: values.email,
            password: values.password,
            name: values.name!,
          });

      localStorage.setItem('trackflow_token', res.accessToken);
      localStorage.setItem('trackflow_user', JSON.stringify(res.user));
      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.errors?.join(', ') || err.message
          : 'Authentication failed',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark" />
          <Title level={3} style={{ margin: '0 0 4px', color: colors.textPrimary }}>
            TrackFlow
          </Title>
          <Text type="secondary">Issue tracking for your team</Text>
        </div>

        <Title level={4} style={{ textAlign: 'center', marginTop: 28, marginBottom: 8 }}>
          {isLogin ? 'Sign in' : 'Create account'}
        </Title>
        <Paragraph
          type="secondary"
          style={{ textAlign: 'center', fontSize: 13, marginBottom: 20 }}
        >
          New accounts are always <strong>user</strong> role. Promote to{' '}
          <strong>admin</strong> in the database for full platform access.
        </Paragraph>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          {!isLogin && (
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input size="large" placeholder="Your name" />
            </Form.Item>
          )}
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input size="large" placeholder="you@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password size="large" placeholder="••••••••" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              {isLogin ? 'Sign in' : 'Sign up'}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-switch">
          <Text type="secondary">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <Button
            type="link"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              form.resetFields();
            }}
            style={{ padding: 0, color: colors.primary }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
