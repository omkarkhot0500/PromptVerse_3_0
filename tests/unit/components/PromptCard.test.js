import { render, screen, fireEvent } from '@testing-library/react';
import PromptCard from '@components/PromptCard';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next/image to render a simple <img>
jest.mock('next/image', () => {
  const MockImage = (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

const mockPost = {
  _id: '123',
  creator: {
    _id: 'user1',
    username: 'testuser',
    image: '/assets/images/logo.svg',
  },
  prompt: 'Test prompt content',
  tag: 'testtag',
  isPrivate: false,
  expiresAt: null,
};

describe('PromptCard Component', () => {
  beforeEach(() => {
    useSession.mockReturnValue({ data: null });
    // Default: not on profile page
    usePathname.mockReturnValue('/');
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn() },
    });
  });

  test('renders prompt text and tag correctly', () => {
    render(<PromptCard post={mockPost} />);

    expect(screen.getByText('Test prompt content')).toBeInTheDocument();
    expect(screen.getByText('#testtag')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  test('calls handleTagClick when tag is clicked', () => {
    const handleTagClick = jest.fn();
    render(<PromptCard post={mockPost} handleTagClick={handleTagClick} />);

    const tag = screen.getByText('#testtag');
    fireEvent.click(tag);

    expect(handleTagClick).toHaveBeenCalledWith('testtag');
  });

  test('shows edit and delete buttons only if user is the creator and on profile page', () => {
    // Mock user is logged in as the creator
    useSession.mockReturnValue({ data: { user: { id: 'user1' } } });
    // Mock we are on the profile page
    usePathname.mockReturnValue('/profile');

    render(<PromptCard post={mockPost} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('does NOT show edit/delete buttons when user is not the creator', () => {
    useSession.mockReturnValue({ data: { user: { id: 'otherUser' } } });
    usePathname.mockReturnValue('/profile');

    render(<PromptCard post={mockPost} />);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});
