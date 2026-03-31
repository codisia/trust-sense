"""
Setup script for Trust Sense package
"""

from setuptools import setup, find_packages
import os

# Read requirements
def read_requirements(filename):
    with open(filename, 'r') as f:
        return [line.strip() for line in f if line.strip() and not line.startswith('#')]

# Read README
def read_readme():
    if os.path.exists('README.md'):
        with open('README.md', 'r', encoding='utf-8') as f:
            return f.read()
    return ''

setup(
    name='trust-sense',
    version='0.1.0',
    description='Advanced Multimodal Trust Analysis Platform',
    long_description=read_readme(),
    long_description_content_type='text/markdown',
    author='Trust Sense Team',
    author_email='team@trustsense.ai',
    url='https://github.com/trust-sense/trust-sense',
    packages=find_packages(),
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
    ],
    python_requires='>=3.8',
    install_requires=read_requirements('requirements.txt'),
    extras_require={
        'dev': [
            'pytest>=6.0.0',
            'black>=21.0.0',
            'flake8>=3.9.0',
            'mypy>=0.800',
        ],
        'gpu': [
            'torch>=1.9.0',
        ],
        'full': [
            'transformers>=4.21.0',
            'datasets>=2.0.0',
            'accelerate>=0.12.0',
        ]
    },
    include_package_data=True,
    zip_safe=False,
)